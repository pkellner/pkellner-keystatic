---
status: publish
published: true
pubDatetime: 2008-02-16T20:00:00.000Z
title: How to know if LINQ is working efficiently with SQL?
author:
  display_name: Peter Kellner
  login: Peter Kellner
  email: pkellner99@gmail.com
  url: ''
author_login: Peter Kellner
author_email: pkellner99@gmail.com
description: "<p>In this post, we look at how to log from LINQ to SQL to see the actual
  sql generated by the LINQ engine.</p>"
wordpress_id: 100
wordpress_url: https://peterkellner.net/2008/02/16/linqsqllogging/
date: '2008-02-16 08:29:42 -0800'
date_gmt: '2008-02-16 15:29:42 -0800'
categories:
- ASP.NET 3.5
- LINQ
tags: []
---
<p>Recently, I recieved the following question on my blog <a href="/2007/12/24/linqcountfirsttime/">regarding a post I made</a> about using the aggregate function Count.&#160; The question is as follows:</p>
<p>&#160;<em>does the LINQ implementation send a full query or just a count query? That can be a big waste, especially if this is called often?</em></p>
<p><em></em></p>
<p>One of the nice things about LINQ is you don't have to guess.&#160; By simply turning the Log property to true of the DBContext, you can see what LINQ is actually sending to the database.&#160; below is some simple code that shows how to do this.</p>
<p> <!--more-->
<pre class="csharpcode">  <span class="kwrd">protected</span> <span class="kwrd">void</span> Page_Load(<span class="kwrd">object</span> sender, EventArgs e)
    {
        DataClassesDataContext db = <span class="kwrd">new</span> DataClassesDataContext();
        StringWriter sw = <span class="kwrd">new</span> StringWriter();
        db.Log = sw;
        <span class="kwrd">int</span> cnt = (from tbl <span class="kwrd">in</span> db.tblAllTimes select tbl).Count();
        TextBoxResults.Text = sw.ToString();

    }</pre>
<p>
  </p>
<style type="text/css">
<p>.csharpcode, .csharpcode pre<br />
{<br />
	font-size: small;<br />
	color: black;<br />
	font-family: consolas, "Courier New", courier, monospace;<br />
	background-color: #ffffff;<br />
	/*white-space: pre;*/<br />
}<br />
.csharpcode pre { margin: 0em; }<br />
.csharpcode .rem { color: #008000; }<br />
.csharpcode .kwrd { color: #0000ff; }<br />
.csharpcode .str { color: #006080; }<br />
.csharpcode .op { color: #0000c0; }<br />
.csharpcode .preproc { color: #cc6633; }<br />
.csharpcode .asp { background-color: #ffff00; }<br />
.csharpcode .html { color: #800000; }<br />
.csharpcode .attr { color: #ff0000; }<br />
.csharpcode .alt<br />
{<br />
	background-color: #f4f4f4;<br />
	width: 100%;<br />
	margin: 0em;<br />
}<br />
.csharpcode .lnum { color: #606060; }</style>
<p><em></em></p>
<p>The results of running this are as follows:</p>
<p>&#160; <a href="/wp/wp-content/uploads/2008/02/results.jpg"><img style="border-right-width: 0px; border-top-width: 0px; border-bottom-width: 0px; border-left-width: 0px" border="0" alt="results" src="/wp/wp-content/uploads/2008/02/results-thumb.jpg" width="244" height="54" /></a></p>
<p>So, the answer is that is sending what seems to me to be the most efficient request it can.</p>
<p>I more mystery solved.</p>
<p>Thanks for reading.</p>